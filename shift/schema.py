import graphene
from graphene_django import DjangoObjectType
from account.schema import UserType
from account.models import User, UserConnection
from .models import Shift, ShiftConnection
from graphql_jwt.decorators import login_required


class ShiftType(DjangoObjectType):
    class Meta:
        model = Shift


class ShiftConnectionType(DjangoObjectType):
    class Meta:
        model = ShiftConnection


class CreateShift(graphene.Mutation):
    shift = graphene.Field(ShiftType)

    class Arguments:
        from_time = graphene.DateTime()
        to_time = graphene.DateTime()
        note = graphene.String()
        is_sponsored = graphene.Boolean()
        company_id = graphene.ID()

    @login_required
    def mutate(self, info, company_id, from_time, to_time, note, is_sponsored):

        try:
            company = User.objects.get(id=company_id)
            if not company.is_company:
                raise Exception("The Company UserType must not be an Employee")
        except User.DoesNotExist:
            raise Exception("CAN NOT Resolve the Company from id")

        user = info.context.user
        if user.is_company:
            raise Exception("Company CAN NOT Create a Shift")

        try:
            user_connection = UserConnection.objects.get(
                employee=user, company=company)
            if not user_connection.is_confirmed:
                raise Exception("Can not post Shift to UnConfirmed Connection")
        except UserConnection.DoesNotExist:
            raise Exception("Can not post Shift to UnConnected Company")

        shift = Shift(
            from_time=from_time,
            to_time=to_time,
            note=note,
            is_sponsored=is_sponsored,
            posted_by=user,
            posted_to=company,
        )

        shift.save()

        return CreateShift(shift=shift)


class CreateShiftConnection(graphene.Mutation):
    shift_connection = graphene.Field(ShiftConnectionType)

    class Arguments:
        shift_id = graphene.ID()
        proposed_shift_id = graphene.ID()

    @login_required
    def mutate(self, info, shift_id, proposed_shift_id):
        shift = None
        proposed_shift = None

        try:
            shift = Shift.objects.get(id=shift_id)
        except Shift.DoesNotExist:
            raise Exception("IDs CAN NOT Resolve Shift, Check ID!")

        try:
            proposed_shift = Shift.objects.get(id=proposed_shift_id)
        except Shift.DoesNotExist:
            raise Exception("IDs CAN NOT Resolve Proposed Shift, Check ID!")

        if shift == proposed_shift:
            raise Exception(
                "CAN NOT Create a Connection Between the same Shift")

        if shift.posted_by == proposed_shift.posted_by:
            raise Exception(
                "CAN NOT Create a Connection Between Shifts of same User")

        if not shift.posted_to == proposed_shift.posted_to:
            raise Exception(
                "CAN NOT Create a Connection Between Shifts Posted To Different Company")

        user = info.context.user
        if user.is_company:
            raise Exception("Company CAN NOT Create a ShiftConnection")

        if not proposed_shift.posted_by == user:
            raise Exception(
                "The Proposed Shift must belong to the Current User")

        shift_connection, created = ShiftConnection.objects.get_or_create(
            shift=shift,
            proposed_shift=proposed_shift
        )

        if not created:
            return CreateShiftConnection(shift_connection=shift_connection)
            #raise Exception("ShiftConnection Already Exist")

        return CreateShiftConnection(shift_connection=shift_connection)


class ConfirmShiftConnection(graphene.Mutation):
    shift_connection = graphene.Field(ShiftConnectionType)

    class Arguments:
        shift_connection_id = graphene.ID()

    @login_required
    def mutate(self, info, shift_connection_id):

        try:
            shift_connection = ShiftConnection.objects.get(
                id=shift_connection_id)
        except ShiftConnection.DoesNotExist:
            raise Exception("ShiftConnection Does not Exist, Check ID!")

        user = info.context.user
        if user.is_company == True:
            raise Exception("Company CAN NOT Confirm a ShiftConnection")

        # Make sure that the current user == the Shift posted_by in ShiftConnection
        if not shift_connection.shift.posted_by == user:
            raise Exception(
                "Only the posted_by(User) of a Shift CAN Confirm ShiftConnection")

        shift_connection.is_accepted = True
        shift_connection.save()

        return ConfirmShiftConnection(shift_connection=shift_connection)


class ShiftQuery(graphene.ObjectType):
    shifts = graphene.List(ShiftType)
    all_shifts = graphene.List(ShiftType)
    all_shift_connections = graphene.List(ShiftConnectionType)
    @login_required
    def resolve_shifts(self, info, company_id):
        company = User.objects.get(id=company_id)
        return Shift.objects.filter(posted_to=company)

    # Not Safe, Only for Testing

    def resolve_all_shifts(self, info):
        return Shift.objects.all()

    def resolve_all_shift_connections(self, info):
        return ShiftConnection.objects.all()
